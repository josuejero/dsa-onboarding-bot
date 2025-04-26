// services/actionNetwork.js
import axios from 'axios';
import Joi from 'joi';
const emailSchema = Joi.string().email().required();
import { AN_TOKEN } from '../config.js';

// Simple rate limiting
const API_CALLS = [];
const MAX_CALLS_PER_MINUTE = 30;
const MINUTE = 60 * 1000;

function canMakeAPICall() {
  const now = Date.now();
  const recent = API_CALLS.filter(ts => now - ts < MINUTE);
  API_CALLS.length = 0;
  API_CALLS.push(...recent);
  return API_CALLS.length < MAX_CALLS_PER_MINUTE;
}

function recordAPICall() {
  API_CALLS.push(Date.now());
}

/**
 * Look up an email in Action Network with rate limiting
 * @param {string} email
 * @param {number} retries
 * @returns {Promise<boolean>}
 */
export async function lookupAN(email, retries = 2) {
  // 1) Basic type check
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email parameter');
  }
    // Basic presence/type check
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email parameter');
    }
    // Joi email validation
    const { error } = emailSchema.validate(email);
    if (error) {
      throw new Error('Invalid email: ' + error.message);
    }

  // Rate limit
  if (!canMakeAPICall()) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 2000));
      return lookupAN(email, retries - 1);
    }
    throw new Error('Rate limit exceeded. Please try again in a minute.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const filter    = encodeURIComponent(`email_address eq '${cleanEmail}'`);
  const url       = `https://actionnetwork.org/api/v2/people?filter=${filter}`;

  try {
    recordAPICall();
    const { data } = await axios.get(url, {
      headers: { 'OSDI-API-Token': AN_TOKEN },
      timeout: 10000
    });

    const people = data._embedded?.['osdi:people'] || [];
    return people.some(p =>
      p.custom_fields?.actionkit_is_member_in_good_standing === "True"
    );
  } catch (err) {
    // 429 retry
    if (err.response?.status === 429 && retries > 0) {
      const wait = Number(err.response.headers['retry-after'] || 5) * 1000;
      await new Promise(res => setTimeout(res, wait));
      return lookupAN(email, retries - 1);
    }
    // API responded with error
    if (err.response) {
      console.error(`AN API error (${err.response.status}):`, err.response.data);
      throw new Error(`Membership verification failed (${err.response.status}): ${err.response.data?.error || 'Unknown error'}`);
    }
    // No response
    if (err.request) {
      console.error('AN API no response:', err.request);
      throw new Error('No response from membership database. Please try again later.');
    }
    // Other
    console.error('AN API request error:', err.message);
    throw new Error(`Verification error: ${err.message}`);
  }
}
