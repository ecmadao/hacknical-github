
import config from 'config'
import getMongo from '../utils/database'
import logger from '../utils/logger'
import { COLLECTIONS } from '../utils/constant'

const githubUrl = config.get('database.github')

export const getCollection = async (colName) => {
  const db = await getMongo(githubUrl)
  const commitCol = db.collection(colName)
  return commitCol
}

export const initIndex = async () => {
  const db = await getMongo(githubUrl)

  try {
    db.collection(COLLECTIONS.COMMITS).ensureIndex(
      { login: 1, name: 1 },
      { background: true }
    )
    logger.info(`[INDEX] ${COLLECTIONS.COMMITS} index ensured`)
  } catch (e) {
    logger.error(e)
  }

  try {
    db.collection(COLLECTIONS.ORGS).ensureIndex(
      { name: 1, login: 1, company: 1 },
      { background: true }
    )
    logger.info(`[INDEX] ${COLLECTIONS.ORGS} index created`)
  } catch (e) {
    logger.error(e)
  }

  try {
    db.collection(COLLECTIONS.REPOS).ensureIndex(
      { login: 1 },
      { background: true }
    )
    db.collection(COLLECTIONS.REPOS).ensureIndex(
      { full_name: 1 },
      { background: true, unique: true }
    )
    db.collection(COLLECTIONS.REPOS).ensureIndex(
      { name: 1, login: 1, full_name: 1, 'owner.login': 1, stargazers_count: 1 },
      { background: true }
    )
    logger.info(`[INDEX] ${COLLECTIONS.REPOS} index created`)
  } catch (e) {
    logger.error(e)
  }

  try {
    db.collection(COLLECTIONS.USERS).ensureIndex(
      { name: 1, login: 1, company: 1 },
      { background: true }
    )
    db.collection(COLLECTIONS.USERS).ensureIndex(
      { login: 1 },
      { background: true, unique: true }
    )
    logger.info(`[INDEX] ${COLLECTIONS.USERS} index created`)
  } catch (e) {
    logger.error(e)
  }

  try {
    db.collection(COLLECTIONS.USER_INFOS).ensureIndex(
      { login: 1 },
      { background: true, unique: true }
    )
    logger.info(`[INDEX] ${COLLECTIONS.USER_INFOS} index created`)
  } catch (e) {
    logger.error(e)
  }
}
