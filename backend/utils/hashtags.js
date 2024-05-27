module.exports = {
    getHashtags
}

function getHashtags(text) {
    const hashtagRegex = new RegExp("#\\w+", "g");
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
}