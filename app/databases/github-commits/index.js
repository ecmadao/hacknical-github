

const getCommits = async (db, login) =>
  await db.collection('githubcommits').find({ login }).toArray()

export default {
  getCommits
}
