import koaRouter from 'koa-router';
import GitHub from './controller';
import params from '../../middlewares/params';

const router = koaRouter({
  prefix: '/api/github'
});

// zen & octocat
router.get(
  '/zen',
  params.checkApp(),
  GitHub.getZen
);
router.get(
  '/octocat',
  params.checkApp(),
  GitHub.getOctocat
);

router.get(
  '/verify',
  params.checkApp(),
  GitHub.getVerify
);

router.get(
  '/token',
  params.checkApp(),
  params.checkQuery(['code']),
  GitHub.getToken
);
router.get(
  '/login',
  params.checkApp(),
  params.checkQuery(['verify']),
  GitHub.getLogin
);
router.get(
  '/user',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUser
);

router.get(
  '/user/repos',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserRepos
);
router.get(
  '/user/orgs',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserOrgs
);
router.get(
  '/user/orgs/refresh',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserOrgs
);
router.get(
  '/user/refresh',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserDatas
);
router.get(
  '/user/updateTime',
  params.checkApp(),
  params.checkQuery(['login']),
  GitHub.getUserUpdateTime
);

module.exports = router;
