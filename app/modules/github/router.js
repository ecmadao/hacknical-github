import koaRouter from 'koa-router';
import GitHub from './controller';
import params from '../../middlewares/params';

const router = koaRouter({
  prefix: '/api/github'
});

// zen & octocat
router.get(
  '/zen',
  GitHub.getZen
);
router.get(
  '/octocat',
  GitHub.getOctocat
);

router.get(
  '/verify',
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
  '/:login',
  params.checkQuery(['verify']),
  GitHub.getUser
);

router.get(
  '/repository',
  params.checkQuery(['verify', 'fullname']),
  GitHub.getRepository
);
router.get(
  '/repository/readme',
  params.checkQuery(['verify', 'fullname']),
  GitHub.getRepositoryReadme
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
  '/:login/repositories',
  params.checkQuery(['verify']),
  GitHub.getUserRepositories
);
router.get(
  '/:login/contributed',
  params.checkQuery(['verify']),
  GitHub.getUserContributed
);
router.get(
  '/:login/starred',
  params.checkQuery(['verify']),
  GitHub.getUserStarred
);
router.get(
  '/:login/starred/count',
  params.checkQuery(['verify']),
  GitHub.getUserStarredCount
);
router.get(
  '/:login/repositories/refresh',
  params.checkQuery(['verify']),
  GitHub.refreshUserRepositories
);
router.get(
  '/:login/commits',
  params.checkQuery(['verify']),
  GitHub.getUserCommits
);
router.get(
  '/:login/commits/refresh',
  params.checkQuery(['verify']),
  GitHub.refreshUserCommits
);
router.get(
  '/:login/organizations',
  params.checkQuery(['verify']),
  GitHub.getUserOrganizations
);
router.get(
  '/:login/organizations/refresh',
  params.checkQuery(['verify']),
  GitHub.refreshUserOrganizations
);
router.get(
  '/:login/contributed/refresh',
  params.checkQuery(['verify']),
  GitHub.refreshUserContributed
);
router.get(
  '/:login/updateTime',
  GitHub.getUserUpdateTime
);
router.get(
  '/:login/scientific',
  params.checkQuery(['verify']),
  GitHub.getUserScientific
);
router.get(
  '/:login/predictions',
  params.checkQuery(['verify']),
  GitHub.getUserPredictions
);

module.exports = router;
