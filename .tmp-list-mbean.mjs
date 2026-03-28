const basic = Buffer.from('admin:admin').toString('base64');
const payload = {
  type: 'list',
  path: 'org.apache.activemq.artemis:broker="0.0.0.0",component=addresses,address="DLQ",subcomponent=queues,routing-type="anycast",queue="DLQ"'
};
const res = await fetch('http://localhost:8161/console/jolokia', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
console.log(await res.text());
