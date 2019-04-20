
import logger from '../../utils/logger'
import Helper from '../shared/helper'

const updateOne = async (col, doc, obj) => {
  try {
    await col.updateOne(
      { _id: doc._id },
      { $set: obj }
    )
  } catch (e) {
    logger.error(e)
  }
}

const sendPredictionMq = (mq, login) => mq.send(login)

const userScientificData = (obj, count = 10) => {
  const result = {};
  Object.keys(obj)
    .sort((current, next) => obj[next] - obj[current])
    .slice(0, count)
    .map(key => (result[key] = obj[key]));
  return result;
};

/* ====================== Controller ======================== */

const getStatistic = async (ctx) => {
  const { login } = ctx.params;
  const usersCol = ctx.scientificDB.collection('users');

  const user = await usersCol.findOne({ login });
  if (!user) {
    ctx.body = {
      success: false,
    };
    return;
  }
  const {
    starred,
    created,
  } = user;
  ctx.body = {
    success: true,
    result: {
      starred: {
        keywords: userScientificData(starred.keywords, 20),
        languages: userScientificData(starred.languages),
      },
      created: {
        keywords: userScientificData(created.keywords, 20),
        languages: userScientificData(created.languages),
      }
    }
  };
};

const reomvePrediction = async (ctx) => {
  const { login } = ctx.params;
  const { fullName } = ctx.request.body;

  const predictionsCol = ctx.scientificDB.collection('predictions');
  const prediction = await predictionsCol.findOne({ login });

  const { predictions } = prediction;
  const index = predictions.findIndex(item => item.fullName === fullName);
  if (index !== -1) {
    await updateOne(predictionsCol, prediction, {
      predictions: [
        ...predictions.slice(0, index),
        ...predictions.slice(index + 1)
      ]
    });
  }

  sendPredictionMq(ctx.mq.prediction, login);
  ctx.body = {
    success: true,
  };
};

const setPredictionFeedback = async (ctx) => {
  const { login } = ctx.params;
  const { fullName, liked } = ctx.request.body;
  const feedback = Number(liked);

  const predictionsCol = ctx.scientificDB.collection('predictions')
  const usersCol = ctx.scientificDB.collection('users')

  const [
    user,
    prediction,
  ] = await Promise.all([
    usersCol.findOne({ login }),
    predictionsCol.findOne({ login })
  ]);

  const { predictions } = prediction;
  const index = predictions.findIndex(item => item.fullName === fullName);
  if (index !== -1) {
    await updateOne(predictionsCol, prediction, {
      predictions: [
        ...predictions.slice(0, index),
        Object.assign({}, predictions[index], {
          liked: feedback
        }),
        ...predictions.slice(index + 1)
      ]
    });
  }

  const {
    likedRepositories = [],
    unlikedRepositories = [],
  } = user;
  let newUserInfo = null;
  if (feedback === 1) {
    newUserInfo = {
      likedRepositories: [...likedRepositories, fullName]
    };
  } else if (feedback === -1) {
    newUserInfo = {
      unlikedRepositories: [...unlikedRepositories, fullName]
    };
  }
  await updateOne(usersCol, user, newUserInfo);
  sendPredictionMq(ctx.mq.prediction, login);
  ctx.body = {
    success: true,
  };
};

const getPredictions = async (ctx) => {
  const { login } = ctx.params;
  const predictionsCol = ctx.scientificDB.collection('predictions')

  const result = await predictionsCol.findOne({ login });
  if (!result) {
    ctx.body = {
      success: false,
    };
    return;
  }
  const { predictions } = result;
  const results = [];
  await Promise.all(predictions.slice(0, 7).map(async (prediction) => {
    const {
      fullName,
      liked = 0,
    } = prediction;
    try {
      const repository = await Helper.getRepository(fullName);
      const {
        name,
        owner,
        html_url,
        language,
        full_name,
        description,
        forks_count,
        stargazers_count,
      } = repository;
      results.push({
        name,
        liked,
        owner,
        html_url,
        language,
        full_name,
        description,
        forks_count,
        stargazers_count,
        login: repository.login,
      });
    } catch (e) {
      logger.error(e);
    }
  }));
  ctx.body = {
    success: true,
    result: results
  };
};

export default {
  getStatistic,
  getPredictions,
  reomvePrediction,
  setPredictionFeedback
};
