const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

async function publishMessage(text) {
  try {
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: process.env.CHANNEL_ID,
      text: text
    });
  }
  catch (error) {
    console.error(error);
  }
}

function runQuery () {
    const mysql = require("mysql");
    const connection = mysql.createConnection({
      host: "10.8.0.140",
      port: 3315,
      database: "sms",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    connection.connect((error) => {
      if (error) {
        console.log("Error connecting to the MySQL Database");
        return;
      }
      console.log("Connection established sucessfully");
    });

    const query = 'SELECT iu.ean AS GTIN, su.region_code, su.sale_channel_type, iu.inventory_id, \
                sup.sale_price as sale_price_gross, sup.vendor_fulfilment_price AS VIP \
              FROM sms.inventory_units iu \
              JOIN sms.inventories i ON iu.inventory_id = i.id \
              LEFT JOIN sms.inventory_unit_region iur ON iu.id = iur.inventory_unit_id \
              JOIN sms.sale_items si ON si.ean = iu.ean \
              JOIN sms.sale_units su ON su.sale_item_id = si.id AND iu.id = su.inventory_unit_id \
              JOIN sms.sale_unit_price sup ON sup.sale_unit_id = su.id AND sup.volume_quantity = 1 \
              WHERE sup.sale_price < sup.vendor_fulfilment_price * 0.7 \
                AND iu.availability = "available" \
                AND COALESCE(iur.status, "") NOT LIKE "disabl%" \
                AND (iu.quantity - iu.blocked_quantity - iu.reserved) > 0 \
                AND iu.type = "retail" \
                AND iu.marked_for_purge = 0 \
                AND i.type IN ("warehouse", "dropship") \
                AND sup.volume_quantity > 0;';

    connection.query(query, function (error, result, fields) {
      if (error) throw error;
      var resultArray = Object.values(JSON.parse(JSON.stringify(result, null, '\t')));
      console.log(resultArray);
      publishMessage(resultArray);
    });
    connection.end((error) => {});
  };

function main() {
  const date = new Date();
  date.toLocaleString();
  const text = `${date} \n Exported offers with suspiciously low sale prices:`;
  publishMessage(text);
  runQuery();
}

main();

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('Bolt app is running!');
})();
