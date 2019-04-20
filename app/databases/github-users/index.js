
const findUser = async (db, login) =>
  await db.collection('githubusers').findOne({ login })

const updateUser = async (db, userInfo) => {
  const lastUpdateTime = new Date()

  await db.collection('githubusers').updateOne(
    { login: userInfo.login },
    {
      $set: Object.assign({}, userInfo, { lastUpdateTime })
    },
    { upsert: true }
  )
  return lastUpdateTime
}

export default {
  updateUser,
  findUser
}
