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
  params.checkQuery(['code']),
  GitHub.getToken
);

router.get(
  '/login',
  params.checkQuery(['verify']),
  GitHub.getLogin
);
router.get(
  '/user',
  params.checkQuery(['login', 'verify']),
  GitHub.getUser
);

router.get(
  '/repository',
  params.checkQuery(['verify', 'fullname']),
  GitHub.getRepository
);
router.put(
  '/repository/star',
  params.checkQuery(['verify']),
  params.checkBody(['fullname']),
  GitHub.starRepository
);
router.delete(
  '/repository/star',
  params.checkQuery(['verify']),
  params.checkBody(['fullname']),
  GitHub.unstarRepository
);


router.get(
  '/user/repos',
  params.checkQuery(['login', 'verify']),
  GitHub.getUserRepos
);
router.get(
  '/user/repos/refresh',
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserRepos
);
router.get(
  '/user/commits',
  params.checkQuery(['login', 'verify']),
  GitHub.getUserCommits
);
router.get(
  '/user/commits/refresh',
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserCommits
);
router.get(
  '/user/orgs',
  params.checkQuery(['login', 'verify']),
  GitHub.getUserOrgs
);
router.get(
  '/user/orgs/refresh',
  params.checkQuery(['login', 'verify']),
  GitHub.refreshUserOrgs
);
router.get(
  '/user/updateTime',
  params.checkQuery(['login']),
  GitHub.getUserUpdateTime
);

module.exports = router;
