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
  '/userDatas',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserDatas
);
router.get(
  '/userDatas/orgs',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserOrgs
);
router.get(
  '/userDatas/refresh',
  params.checkApp(),
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserDatas
);
router.get(
  '/userDatas/updateTime',
  params.checkApp(),
  params.checkQuery(['login']),
  GitHub.getUserUpdateTime
);

module.exports = router;
