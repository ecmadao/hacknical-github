import config from 'config';

const slack = config.get('services.slack');
const slackUrl = slack.url;

const mqConfig = config.get('mq');
const qName = mqConfig['qname-messenger'];

class SlackMsg {
  constructor(mq) {
    this.mq = mq;
    this._refreshMsg = this._refreshMsg.bind(this);
  }

  wrapMsg({ message, type, url }) {
    const msg = {
      data: message,
      channel: {
        url,
        type,
      },
    };
    return JSON.stringify(msg);
  }

  send(msg) {
    if (!slackUrl) return;
    const message = this.format(msg);
    this.mq.sendMessage({
      message: this.wrapMsg({
        message,
        url: slackUrl,
        type: 'slack',
      }),
      qname: qName
    });
  }

  format(msg) {
    if (msg.type) {
      return this.formatMsg[msg.type](msg.data);
    }
    return msg;
  }

  get formatMsg() {
    return {
      refresh: this._refreshMsg,
    };
  }

  _refreshMsg(data) {
    return `*🙈 Refresh*\n>${data}`;
  }
}

export default SlackMsg;
