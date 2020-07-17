/* eslint no-loop-func: "off" */

import fetch from '../utils/request'
import {
  flattenObject,
} from '../utils/helpers'
import { GITHUB } from '../utils/github'

const {
  API_TOKEN,
  API_GET_USER,
} = GITHUB

const starRepository = (fullname, verify) => {
  const { qs, headers } = verify
  return fetch.put({
    qs,
    headers,
    url: `${API_GET_USER}/starred/${fullname}`
  })
}

const unstarRepository = (fullname, verify) => {
  const { qs, headers } = verify
  return fetch.delete({
    qs,
    headers,
    url: `${API_GET_USER}/starred/${fullname}`
  })
}


/* =========================== github api =========================== */

const getUserByToken = async (verify) => {
  const { headers } = verify
  return fetch.get({
    qs: {},
    headers,
    url: API_GET_USER
  })
}

const getOctocat = (verify) => {
  const { headers } = verify
  return fetch.get({
    qs: {},
    headers,
    url: GITHUB.OCTOCAT
  })
}

const getZen = (verify) => {
  const { qs, headers } = verify
  return fetch.get({
    qs,
    headers,
    url: GITHUB.ZEN
  })
}

const getToken = (code, verify) => {
  const { qs, headers } = verify
  return fetch.post({
    headers,
    url: `${API_TOKEN}?code=${code}&${flattenObject(qs)}`
  })
}

export default {
  getZen,
  getOctocat,
  getToken,
  getUserByToken,
  starRepository,
  unstarRepository,
}
