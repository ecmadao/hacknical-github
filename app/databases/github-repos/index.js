
const getRepositories = async (db, query) =>
  await db.collection('githubrepos').find(query).toArray()

const getRepository = async (db, query) =>
  await db.collection('githubrepos').findOne(query)

export default {
  getRepository,
  getRepositories
}
