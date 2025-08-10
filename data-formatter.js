/**
 * Data Formatting Utilities
 * Common formatting functions I use across automation projects
 * Built by Aldo for clean data processing
 */

class DataFormatter {
  
  /**
   * Clean and format phone numbers to standard format
   * @param {string} phone - Raw phone number
   * @returns {string} - Formatted phone (+44XXXXXXXXXX)
   */
  static formatPhoneUK(phone) {
    if (!phone) return '';
    
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle UK numbers
    if (cleaned.startsWith('44')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+44${cleaned.substring(1)}`;
    }
    
    return `+44${cleaned}`;
  }
  
  /**
   * Extract and clean email addresses
   * @param {string} text - Text containing email
   * @returns {string|null} - Clean email or null
   */
  static extractEmail(text) {
    if (!text) return null;
    
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    
    return match ? match[0].toLowerCase().trim() : null;
  }
  
  /**
   * Convert various date formats to ISO string
   * @param {string} dateStr - Date in various formats
   * @returns {string} - ISO date string
   */
  static standardizeDate(dateStr) {
    if (!dateStr) return '';
    
    // Handle common UK date formats
    const ukFormat = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = dateStr.match(ukFormat);
    
    if (match) {
      const [, day, month, year] = match;
      return new Date(`${year}-${month}-${day}`).toISOString();
    }
    
    return new Date(dateStr).toISOString();
  }
  
  /**
   * Clean and format currency amounts
   * @param {string|number} amount - Raw amount
   * @returns {number} - Clean number
   */
  static cleanCurrency(amount) {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    
    // Remove currency symbols and spaces
    const cleaned = amount.toString()
      .replace(/[£$€,\s]/g, '')
      .replace(/[^\d.-]/g, '');
    
    return parseFloat(cleaned) || 0;
  }
}

module.exports = DataFormatter;
