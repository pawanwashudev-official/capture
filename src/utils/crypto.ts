import nacl from 'tweetnacl';

// Helper to convert Uint8Array to Base64
export const toBase64 = (bytes: Uint8Array): string => {
  return btoa(String.fromCharCode(...bytes));
};

// Helper to convert Base64 to Uint8Array
export const fromBase64 = (base64: string): Uint8Array => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export const generateKeyPair = (): KeyPair => {
  const pair = nacl.box.keyPair();
  return {
    publicKey: toBase64(pair.publicKey),
    secretKey: toBase64(pair.secretKey),
  };
};

export const encryptImage = async (imageBlob: Blob, publicKeyBase64: string): Promise<Uint8Array> => {
  const publicKey = fromBase64(publicKeyBase64);
  const imageData = new Uint8Array(await imageBlob.arrayBuffer());
  
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  const encrypted = nacl.box(
    imageData,
    nonce,
    publicKey,
    ephemeral.secretKey
  );

  const result = new Uint8Array(ephemeral.publicKey.length + nonce.length + encrypted.length);
  result.set(ephemeral.publicKey, 0);
  result.set(nonce, ephemeral.publicKey.length);
  result.set(encrypted, ephemeral.publicKey.length + nonce.length);
  
  return result;
};

export const decryptImage = async (packagedData: Uint8Array, secretKeyBase64: string): Promise<Blob> => {
  const secretKey = fromBase64(secretKeyBase64);
  
  const pubKeyLen = 32;
  const nonceLen = 24;
  
  if (packagedData.length < pubKeyLen + nonceLen) {
    throw new Error('Invalid encrypted file format.');
  }

  const ephemeralPublicKey = packagedData.slice(0, pubKeyLen);
  const nonce = packagedData.slice(pubKeyLen, pubKeyLen + nonceLen);
  const encryptedData = packagedData.slice(pubKeyLen + nonceLen);
  
  const decrypted = nacl.box.open(
    encryptedData,
    nonce,
    ephemeralPublicKey,
    secretKey
  );
  
  if (!decrypted) {
    throw new Error('Decryption failed. Invalid key or corrupted file.');
  }
  
  return new Blob([decrypted as any], { type: 'image/jpeg' });
};
