import koaRouter from 'koa-router';
import Scientific from './controller';
import params from '../../middlewares/params';

const router = koaRouter({
  prefix: '/api/scientific'
});

router.get(
  '/:login/statistic',
  params.checkQuery(['verify']),
  Scientific.getStatistic
);

router.get(
  '/:login/predictions',
  params.checkQuery(['verify']),
  Scientific.getPredictions
);

router.put(
  '/:login/predictions',
  params.checkQuery(['verify']),
  params.checkBody(['fullName', 'liked']),
  Scientific.setPredictionFeedback
);

module.exports = router;
