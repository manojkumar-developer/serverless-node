/* 

Component : common

*/
/** ****************************** Import Packages *************************** */
require("moment-timezone");
const moment = require("moment");

const DEFAULT_TIMEZONE = "America/Los_Angeles";

const displayDate = (date, format = "MM/DD/YYYY") => {
  const timezone = DEFAULT_TIMEZONE;
  const formatted = moment.utc(date).tz(timezone);
  if (formatted.isValid()) {
    const tzFormat = format.replace(" z", "").replace("z", " ");
    return formatted.format(`${tzFormat}`);
  }
  return formatted;
};

const sleep = milliseconds => {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

const displayReadDate = (date, format = "MMMM DD,YYYY") => {
  const timezone = DEFAULT_TIMEZONE;
  const formatted = moment.utc(date).tz(timezone);
  if (formatted.isValid()) {
    const tzFormat = format.replace(" z", "").replace("z", " ");
    return formatted.format(`${tzFormat}`);
  }
  return formatted;
};

const displayDateTime = (date, format = "YYYY-MM-DD") => {
  const timezone = DEFAULT_TIMEZONE;
  const formatted = moment.utc(date).tz(timezone);
  if (formatted.isValid()) {
    const tzFormat = format.replace(" z", "").replace("z", " ");
    return formatted.format(`${tzFormat}`);
  }
  return formatted;
};

const displayTime = (time, format = "h:m") => {
  const timezone = DEFAULT_TIMEZONE;
  const formatted = moment.utc(time).tz(timezone);
  if (formatted.isValid()) {
    const tzFormat = format.replace(" z", "").replace("z", " ");
    return formatted.format(`${tzFormat}`);
  }
  return formatted;
};

const displayRawDate = date => {
  const timezone = DEFAULT_TIMEZONE;
  const format = "MMMM Do YYYY";
  const formatted = moment.utc(date).tz(timezone);
  if (formatted.isValid()) {
    const tzFormat = format.replace(" z", "").replace("z", " ");
    return formatted.format(`${tzFormat}`);
  }
  return formatted;
};

const inputFormat = (date, format = "YYYY-MM-DD") => {
  const timezone = DEFAULT_TIMEZONE;
  const formatted = moment.utc(date).tz(timezone);
  if (formatted.isValid()) {
    const tzFormat = format.replace(" z", "").replace("z", " ");
    return formatted.format(`${tzFormat}`);
  }
  return formatted;
};

const displayAmountWithComma = amount => {
  if (amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
};

const displayAmount = amount => {
  if (amount || amount === 0) {
    const result = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$${result}`;
  }
};

const displayNameLetters = (firstName, lastName) => {
  const result =
    firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
  return result;
};

const leadsZero = input => `0${input}`.slice(-2);

const displayName = (firstName, lastName) => {
  const result = `${firstName} ${lastName}`;
  return result;
};

const displayEin = ein => {
  let result;
  if (ein.length === 9) {
    result = `${ein[0] + ein[1]}-${ein[2]}${ein[3]}${ein[4]}`;
    result += `${ein[5]}${ein[6]}${ein[7]}${ein[8]}`;
  } else if (ein.length === 8) {
    result = `0${ein[0]}-${ein[1]}${ein[2]}${ein[3]}`;
    result += `${ein[4]}${ein[5]}${ein[6]}${ein[7]}`;
  }
  return result;
};

const displayPhone = phoneNumber => {
  const cleaned = `${phoneNumber}`.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return null;
};

const displayDescription = description => {
  if (description) {
    return description.replace(/<\/?[a-z][a-z0-9]*[^<>]*>/gi, "");
  }
};

module.exports = {
  DEFAULT_TIMEZONE,
  displayDate,
  displayReadDate,
  displayDateTime,
  displayTime,
  displayRawDate,
  inputFormat,
  displayAmountWithComma,
  displayAmount,
  displayName,
  displayNameLetters,
  displayEin,
  displayPhone,
  displayDescription,
  leadsZero,
  sleep
};
