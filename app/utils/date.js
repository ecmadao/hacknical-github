import moment from 'moment';

moment.locale('zh-cn');

const formatDate = date => format => moment(date).format(format);
const getSeconds = date => parseInt(formatDate(new Date(date))('X'), 10);

export default {
  getSeconds,
  format: (f, date) => formatDate(date)(f),
  getDateBeforeYears: (years, format = 'L') =>
    moment().add(-parseInt(years, 10), 'years').format(format)
};
