
const findUserInfo = async (db, login) => {
  const infoCol = db.collection('githubusersinfos')
  const userInfo = await infoCol.findOne({ login })
  if (!userInfo) {
    const data = {
      login,
      starred: [],
      organizations: [],
      contributions: [],
      starredFetched: false
    }
    await infoCol.insert(data)
    return data
  }
  return userInfo
}

export default {
  findUserInfo
}
