export const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey)
        return res.status(401).json({ error: 'API key required' });
    // TODO: validate against stored keys
    next();
};
