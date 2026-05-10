const supabase = require("../dbConnection.js");
const { decrypt } = require("../services/encryptionService");

function isEncryptedJsonString(value) {
	if (typeof value !== "string") {
		return false;
	}

	try {
		const parsed = JSON.parse(value);
		return Boolean(
			parsed &&
			typeof parsed === "object" &&
			parsed.encrypted &&
			parsed.iv &&
			parsed.authTag
		);
	} catch (_error) {
		return false;
	}
}

async function decryptFieldIfNeeded(value) {
	if (!value || !isEncryptedJsonString(value)) {
		return value;
	}

	const encryptedObj = JSON.parse(value);
	return decrypt(encryptedObj.encrypted, encryptedObj.iv, encryptedObj.authTag);
}

async function decryptSensitiveFields(profile) {
	if (!profile) {
		return profile;
	}

	const decryptedContact = await decryptFieldIfNeeded(profile.contact_number);
	const decryptedAddress = await decryptFieldIfNeeded(profile.address);

	return {
		...profile,
		contact_number: decryptedContact,
		address: decryptedAddress,
	};
}

async function getUserProfile(lookup = {}) {
	try {
		const query = supabase
			.from("users")
			.select(
				"user_id,name,first_name,last_name,email,contact_number,mfa_enabled,address,image_id,registration_date,last_login,account_status,profile_encrypted,profile_encryption_iv,profile_encryption_auth_tag,profile_encryption_key_version,user_roles!left(role_name)"
			);

		if (lookup.userId != null) {
			query.eq("user_id", lookup.userId);
		} else if (lookup.email) {
			query.eq("email", lookup.email);
		} else {
			throw new Error("A userId or email lookup is required");
		}

		const { data, error } = await query.maybeSingle();
		if (error) {
			throw error;
		}

		if (!data) {
			return null;
		}

		const profile = await decryptSensitiveFields(data);

		if (profile.image_id != null) {
			profile.image_url = await getImageUrl(profile.image_id);
		} else {
			profile.image_url = null;
		}

		return profile;
	} catch (error) {
		throw error;
	}
}

async function getImageUrl(image_id) {
	try {
		if (image_id == null) return "";
		let { data } = await supabase
			.from("images")
			.select("*")
			.eq("id", image_id);
		if (data[0] != null) {
			return await resolveImageUrl(data[0].file_name);
		}
		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
}

async function resolveImageUrl(file_name) {
	if (!file_name) return null;

	// Signed URL works for both public and private buckets.
	const { data: signedData, error: signedError } = await supabase
		.storage
		.from("images")
		.createSignedUrl(file_name, 60 * 60 * 24);

	if (!signedError && signedData?.signedUrl) {
		return signedData.signedUrl;
	}

	// Fallback to public URL if signing fails for any reason.
	const { data: publicData } = supabase
		.storage
		.from("images")
		.getPublicUrl(file_name);

	return publicData?.publicUrl || null;
}

module.exports = getUserProfile;
