import koaRouter from 'koa-router';
import GitHub from './controller';
import params from '../../middlewares/params';
import verify from '../../middlewares/github_verify';

const router = koaRouter({
  prefix: '/api/github'
});

// zen & octocat
router.get(
  '/zen',
  params.checkApp(),
  verify(),
  GitHub.getZen
);
router.get(
  '/octocat',
  params.checkApp(),
  verify(),
  GitHub.getOctocat
);

router.get(
  '/verify',
  params.checkApp(),
  verify(),
  GitHub.getVerify
);
router.get(
  '/token',
  params.checkApp(),
  verify(),
  params.checkQuery(['code']),
  GitHub.getToken
);

router.get(
  '/login',
  params.checkApp(),
  verify(),
  params.checkQuery(['verify']),
  GitHub.getLogin
);
router.get(
  '/user',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUser
);

router.get(
  '/repository',
  params.checkApp(),
  verify(),
  params.checkQuery(['verify', 'fullname']),
  GitHub.getRepository
);
router.put(
  '/repository/star',
  params.checkApp(),
  verify(),
  params.checkQuery(['verify']),
  params.checkBody(['fullname']),
  GitHub.starRepository
);
router.delete(
  '/repository/star',
  params.checkApp(),
  verify(),
  params.checkQuery(['verify']),
  params.checkBody(['fullname']),
  GitHub.unstarRepository
);


router.get(
  '/user/repos',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserRepos
);
router.get(
  '/user/repos/refresh',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserRepos
);
router.get(
  '/user/commits',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserCommits
);
router.get(
  '/user/commits/refresh',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserCommits
);
router.get(
  '/user/orgs',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.getUserOrgs
);
router.get(
  '/user/orgs/refresh',
  params.checkApp(),
  verify(),
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserOrgs
);
router.get(
  '/user/updateTime',
  params.checkApp(),
  verify(),
  params.checkQuery(['login']),
  GitHub.getUserUpdateTime
);

module.exports = router;
