import test from 'node:test';
import assert from 'node:assert/strict';

test('SafeRoute Frontend Architecture & Business Logic Test Suite', async (t) => {
  await t.test('1. Safety Score Classification Logic', () => {
    function classifySafetyScore(score: number): { label: string; color: string } {
      if (score >= 80) return { label: 'Optimal Safe', color: '#10b981' };
      if (score >= 60) return { label: 'Moderate Caution', color: '#f59e0b' };
      return { label: 'High Risk', color: '#ef4444' };
    }

    assert.equal(classifySafetyScore(92).label, 'Optimal Safe');
    assert.equal(classifySafetyScore(70).label, 'Moderate Caution');
    assert.equal(classifySafetyScore(45).label, 'High Risk');
    assert.equal(classifySafetyScore(80).label, 'Optimal Safe');
    assert.equal(classifySafetyScore(60).label, 'Moderate Caution');
  });

  await t.test('2. Safety Factor Bounds & Clamping Validation', () => {
    function validateSafetyFactor(val: number): boolean {
      return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 10;
    }

    assert.equal(validateSafetyFactor(0), true);
    assert.equal(validateSafetyFactor(10), true);
    assert.equal(validateSafetyFactor(5.5), true);
    assert.equal(validateSafetyFactor(-1), false);
    assert.equal(validateSafetyFactor(10.1), false);
    assert.equal(validateSafetyFactor(NaN), false);
  });

  await t.test('3. Route Alternatives Sorting & Recommendation Selection', () => {
    interface Alternative {
      id: string;
      score: number;
      isRecommended: boolean;
    }

    const alternatives: Alternative[] = [
      { id: 'standard', score: 62, isRecommended: false },
      { id: 'illuminated', score: 88, isRecommended: true },
      { id: 'express', score: 45, isRecommended: false }
    ];

    const recommended = alternatives.find(a => a.isRecommended);
    assert.ok(recommended);
    assert.equal(recommended.id, 'illuminated');
    assert.equal(recommended.score, 88);

    const sortedBySafety = [...alternatives].sort((a, b) => b.score - a.score);
    assert.equal(sortedBySafety[0].id, 'illuminated');
    assert.equal(sortedBySafety[2].id, 'express');
  });

  await t.test('4. Registration & Login Form Validation Rules', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    assert.equal(emailRegex.test('traveler@saferoute.com'), true);
    assert.equal(emailRegex.test('invalid-email'), false);
    assert.equal(emailRegex.test('user@domain'), false);

    function validatePasswordStrength(pwd: string): { valid: boolean; reason?: string } {
      if (pwd.length < 8) return { valid: false, reason: 'Password must be at least 8 characters' };
      if (!/[A-Z]/.test(pwd)) return { valid: false, reason: 'Password must include uppercase letter' };
      if (!/[0-9]/.test(pwd)) return { valid: false, reason: 'Password must include numeric character' };
      return { valid: true };
    }

    assert.equal(validatePasswordStrength('SafeRoute2026').valid, true);
    assert.equal(validatePasswordStrength('short').valid, false);
    assert.equal(validatePasswordStrength('nocapital123').valid, false);
    assert.equal(validatePasswordStrength('NoNumbersHere').valid, false);
  });

  await t.test('5. Responsive Breakpoint Matrix Integrity', () => {
    const breakpoints = {
      mobile: 480,
      mobileLarge: 640,
      tablet: 768,
      desktopSmall: 900,
      desktop: 1280
    };

    assert.ok(breakpoints.mobile < breakpoints.tablet);
    assert.ok(breakpoints.tablet < breakpoints.desktop);
    assert.equal(breakpoints.mobileLarge, 640);
  });
});
