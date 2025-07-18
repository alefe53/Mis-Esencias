// src/services/imageService.js
import { config } from "../config/config.js";
import * as imageRepository from "../repositories/imageRepository.js";
import { createMultipleSignedUrls, createScopedClient } from "../utils/supabaseUtils.js";


const BUCKET_NAME = config.supabase.buckets.PRIVATE;

export const getPrivateGalleryImages = async (galleryKey, userAuthToken) => {
    const supabaseAuthedClient = createScopedClient(userAuthToken);

    const imagesData = await imageRepository.getGalleryByKeyFromDB(galleryKey, supabaseAuthedClient);

    if (!imagesData || imagesData.length === 0) {
        return [];
    }
    
    const paths = imagesData.map(img => img.file_path);
    const signedUrlsData = await createMultipleSignedUrls(BUCKET_NAME, paths);

    if (!signedUrlsData) {
        throw new Error("No se pudieron generar las URLs seguras para las imágenes.");
    }
    
    return imagesData.map(imageData => {
        const signedUrlItem = signedUrlsData.find(item => item.path === imageData.file_path);
        return {
            ...imageData,
            signedUrl: signedUrlItem ? signedUrlItem.signedUrl : null,
        };
    });
};