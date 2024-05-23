import { decodeJwt } from './buffer';

const EXPIRATION_MS_LEEWAY = 2 * 60 * 60 * 1000; // 2 hours

export function willAccessTokenExpireSoon(accessToken: string) {
	try {
		const now = new Date();
		const decoded = decodeJwt(accessToken);
		const expirationDate = new Date(decoded.exp * 1000);

		// Add 2 hours of leeway
		if (expirationDate.getTime() < now.getTime() - EXPIRATION_MS_LEEWAY) {
			return true;
		}
	} catch (e) {
		// TODO: seems like this doesnt work as expected. if it fails to parse. we do nothing.
		// let the frontend handle it.
	}

	return false;
}
