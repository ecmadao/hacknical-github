
import logger from '../../utils/logger'
import OrgsModel from '../../databases/github-orgs'
import ReposModel from '../../databases/github-repos'
import ReposReadmeModel from '../../databases/github-repos-readme'
import CommitsModel from '../../databases/github-commits'
import UsersInfoModal from '../../databases/github-users-info'

/**
 * =============== repos ===============
 */

const getRepository = async (db, fullname) =>
  await ReposModel.getRepository(db, { full_name: fullname })

const getRepositoryReadme = async (db, fullname) =>
  await ReposReadmeModel.findReadme(db, { fullname })

const getRepositories = async (db, fullnames) =>
  await ReposModel.getRepositories(
    db,
    {
      full_name: {
        $in: fullnames
      }
    }
  )

const getUserRepositories = async (db, login) =>
  await ReposModel.getRepositories(db, { login })

const getUserContributed = async (db, login) => {
  const userInfo = await UsersInfoModal.findUserInfo(db, login)
  const { contributions = [] } = userInfo

  const repositories = await ReposModel.getRepositories(db, {
    full_name: {
      $in: contributions
        .map(contribution => contribution.fullname)
        .filter(n => n)
    }
  })

  return repositories
}

const getStarredRepositories = async (db, starred) => {
  const repositories = await ReposModel.getRepositories(db, {
    full_name: {
      $in: starred
    }
  })

  return repositories
}

const getUserStarred = async (db, login) => {
  const userInfo = await UsersInfoModal.findUserInfo(db, login)
  if (userInfo.starredFetched) {
    logger.info(`[STARRED][get ${login} starred from database]`)
    const result = await getStarredRepositories(db, userInfo.starred)
    if (result.length) return result
  }

  return []
}

/**
 * =============== commits ===============
 */
const getCommits = async (db, login) =>
  await CommitsModel.getCommits(db, login)

/**
 * =============== languages ===============
 */
const getLanguages = async (db, login) => {
  const userInfo = await UsersInfoModal.findUserInfo(db, login)
  return userInfo.languages || {}
}

/**
 * =============== orgs ===============
 */
const getReposByFullnames = async (db, repositoriesMap) =>
  await ReposModel.getRepositories(
    db,
    {
      full_name: {
        $in: [...repositoriesMap.values()]
      }
    }
  )

const getOrgRepositories = async (db, options = {}) => {
  const {
    org,
    login,
  } = options

  const results = []
  let repositories = []
  try {
    repositories = await getUserRepositories(db, org.login)
  } catch (e) {
    repositories = []
    logger.error(e)
  }

  if (repositories && repositories.length) {
    try {
      const contributeds = await getUserContributed(db, login)
      const contributedsSet = new Set(
        contributeds.map(item => item.full_name)
      )
      const contributedsInOrgSet = new Set()

      repositories.forEach((repository) => {
        if (repository.contributors && repository.contributors.length) {
          results.push(repository)
        } else if (contributedsSet.has(repository.full_name)) {
          contributedsInOrgSet.add(repository.full_name)
        }
      })
      if (contributedsInOrgSet.size) {
        results.push(...await getReposByFullnames(db, contributedsInOrgSet))
      }
    } catch (err) {
      logger.error(err)
    }
  }
  return results
}

const getUserOrganizations = async (db, login) => {
  const userInfo = await UsersInfoModal.findUserInfo(db, login)
  const { organizations = [] } = userInfo
  return organizations
}

const getOrganizationsInfo = async (db, pubOrgs) => {
  const logins = pubOrgs.map(pubOrg => pubOrg.login).filter(login => login)
  const organizations = await OrgsModel.find(db, {
    login: {
      $in: logins
    }
  })
  return organizations
}

const getOrganizations = async (db, login) => {
  const userOrganizations = await getUserOrganizations(db, login)
  const organizations =
    await getOrganizationsInfo(db, userOrganizations)

  // get organizations repositories
  const results = await Promise.all(organizations.map(async (org) => {
    const {
      name,
      blog,
      html_url,
      created_at,
      avatar_url,
      description,
      public_repos
    } = org
    const repositories = await getOrgRepositories(db, {
      org,
      login,
    })
    return {
      name,
      blog,
      html_url,
      avatar_url,
      created_at,
      description,
      public_repos,
      login: org.login,
      repos: repositories
    }
  }))
  return results
}

export default {
  // orgs
  getOrganizations,
  // commits
  getCommits,
  // languages
  getLanguages,
  // repos
  getRepository,
  getUserStarred,
  getRepositories,
  getUserContributed,
  getRepositoryReadme,
  getUserRepositories,
}
