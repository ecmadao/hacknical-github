
/* === API === */

const find = async (db, query) =>
  await db.collection('githuborgs').find(query).toArray()

export default {
  find
}
