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
  params.checkHeaders(['user-agent']),
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
  '/userDatas',
  params.checkQuery(['login', 'verify']),
  GitHub.getUserDatas
);

module.exports = router;
