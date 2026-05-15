/**
 * Trigger a short vibration if the Vibration API is available
 * and the user hasn't disabled vibrations in their system settings.
 * @param {number} [duration=10] - Vibration duration in ms
 */
export function lightTap(duration = 10) {
	if (typeof navigator !== 'undefined' && navigator.vibrate) {
		navigator.vibrate(duration);
	}
}
