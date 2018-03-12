/**
 * @class StringHelper
*/
class StringHelper {
  /**
   * @method validateEmail
   * @param {String} email
   * @desc validates if an email is valid
   * @return {Boolean} return true if the email is valid
  */
  static validateEmail(email) {
    // checking to see email pass RFC2822 standards
    const RFC2822EmailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    return RFC2822EmailRegex.test(email);
  }
  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

export default StringHelper;
