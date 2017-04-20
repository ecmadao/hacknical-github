import moment from 'moment';
moment.locale('zh-cn');

const formatDate = (date) => (format) => moment(date).format(format);
const getSeconds = (date) => parseInt(formatDate(new Date(date))('X'));

export default {
  getSeconds,
  getDateBeforeYears: (years) => moment().add(-parseInt(years), 'years').format('L')
};
