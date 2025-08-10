/**
 * Advanced API Client with Retry Logic & Rate Limiting
 * Built by Aldo for robust automation workflows
 * Handles real-world API challenges that basic fetch() can't
 */

class AdvancedAPIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.rateLimit = options.rateLimit || null; // requests per second
    this.lastRequestTime = 0;
    this.defaultHeaders = options.headers || {};
  }

  /**
   * Rate limiting implementation
   */
  async enforceRateLimit() {
    if (!this.rateLimit) return;
    
    const minInterval = 1000 / this.rateLimit;
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    if (timeSinceLastRequest < minInterval) {
      await this.sleep(minInterval - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Exponential backoff retry logic
   */
  async retryWithBackoff(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
      }

      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      
      await this.sleep(delay);
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Advanced request method with all features
   */
  async request(endpoint, options = {}) {
    await this.enforceRateLimit();

    const url = this.baseURL + endpoint;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    return this.retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
    });
  }

  /**
   * Batch processing with concurrency control
   */
  async batchProcess(items, processor, concurrency = 5) {
    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (item, index) => {
        try {
          const result = await processor(item);
          return { index: i + index, result, error: null };
        } catch (error) {
          return { index: i + index, result: null, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ index, result, error }) => {
        if (error) {
          errors.push({ index, error });
        } else {
          results[index] = result;
        }
      });
    }

    return { results, errors };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers
    });
  }

  put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

module.exports = AdvancedAPIClient;
