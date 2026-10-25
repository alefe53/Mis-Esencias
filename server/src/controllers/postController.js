// RUTA: src/controllers/postController.js

import { postService } from "../services/postService.js";

const extractAuthToken = (req) => req.headers.authorization.split(" ")[1];

const getSocialFeed = async (req, res, next) => {
	try {
		const { page, limit } = req.query;
		const authToken = req.headers.authorization.split(" ")[1];
		const userId = req.user.id;
		const feed = await postService.fetchSocialFeed(
			authToken,
			userId,
			page,
			limit,
		);
		res.status(200).json({ success: true, data: feed });
	} catch (error) {
		next(error);
	}
};
const toggleLike = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const authToken = req.headers.authorization.split(" ")[1];
		const result = await postService.togglePostLike(authToken, postId);
		res.status(200).json({ success: true, data: result });
	} catch (error) {
		next(error);
	}
};

const addComment = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const { content, imageUrl, parentId } = req.body;
		const authToken = req.headers.authorization.split(" ")[1];
		const userId = req.user.id;
		const newComment = await postService.addComment(
			{ postId, content, imageUrl, parentId },
			authToken,
			userId,
		);
		res.status(201).json({ success: true, data: newComment });
	} catch (error) {
		next(error);
	}
};

const deletePost = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const authToken = extractAuthToken(req);
		await postService.deletePost(authToken, postId);
		res.status(204).send();
	} catch (error) {
		next(error);
	}
};

const deleteComment = async (req, res, next) => {
	try {
		const { commentId } = req.params;
		const authToken = extractAuthToken(req);
		await postService.deleteComment(authToken, commentId);
		res.status(204).send();
	} catch (error) {
		next(error);
	}
};

const createPost = async (req, res, next) => {
	try {
		const authToken = req.headers.authorization.split(" ")[1];
		const postData = req.body;
		const result = await postService.createPost(authToken, postData);
		res.status(201).json({ success: true, data: result });
	} catch (error) {
		next(error);
	}
};
const castVote = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const { optionId } = req.body;
		const authToken = extractAuthToken(req);

		if (!optionId) {
			return res
				.status(400)
				.json({ success: false, message: "optionId es requerido." });
		}

		const updatedPollData = await postService.castPollVote(
			authToken,
			postId,
			optionId,
		);
		res.status(200).json({ success: true, data: updatedPollData });
	} catch (error) {
		next(error);
	}
};
const toggleCommentLike = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const authToken = extractAuthToken(req);
        const result = await postService.toggleCommentLike(authToken, commentId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
export const postController = {
	getSocialFeed,
	toggleLike,
	addComment,
	deletePost,
	deleteComment,
	createPost,
	castVote,
	toggleCommentLike,
};
