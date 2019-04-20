
const findReadme = async (db, query) =>
  await db.collection('githubreposreadmes').findOne(query)

const findReadmes = async (db, query) =>
  await db.collection('githubreposreadmes').find(query).toArray()

export default {
  findReadme,
  findReadmes
}
