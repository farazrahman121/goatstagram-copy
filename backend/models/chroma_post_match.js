// const { Chroma } = require("@langchain/community/vectorstores/chroma");
// const { OpenAIEmbeddings } = require("@langchain/openai");
// const { TextLoader } = require("langchain/document_loaders/fs/text");
// const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
// const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
 const { Document } = require("langchain/document");
// const { load } = require("cheerio");
const { ChromaClient } = require('chromadb')
const { OpenAIEmbeddingFunction } = require('chromadb');
const process = require('process');
require('dotenv').config();
const embedder = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY, 
    model: "text-embedding-3-small"
})
const sql = require('./db_access');

console.log("starting search chroma client");
const client = new ChromaClient();
console.log("search chroma client started");



// Add a post caption to the chroma collection
async function addPostCaptionToChroma(caption, post_id, user_id) {
    console.log("adding post to chroma");
    console.log("recieved caption: " + caption);
    console.log("recieved post_id: " + post_id);
    console.log("recieved user_id: " + user_id);


    const stringID = "" + post_id;
    console.log(stringID);

    const collection  = await client.getOrCreateCollection({
        name: "search",
        embeddingFunction: embedder,
        metadata: { "hnsw:space": "cosine" }
    });

    console.log("collection found", collection);
    
    await collection.add({
        ids: [stringID],
        metadatas: [{user_id: user_id}],
        documents: [caption]
    });

    const count = await collection.count()
    console.log(`Collection now has ${count} documents.`);

    // LOL DEMO SOON
    if(caption == "RESET_CODE") {
        console.log(`RESET_CODE recieved. Resetting collection.`);
        await client.deleteCollection({name :"search"});
    }
}


// Search for posts in the chroma collection
async function searchPosts(query, k) {
    const collection  = await client.getOrCreateCollection({
        name: "search",
        embeddingFunction: embedder,
        metadata: { "hnsw:space": "cosine" }
    });

    const results = await collection.query({
        queryTexts: query,
        nResults: k
    });

    return results;
}

module.exports = {
    addPostCaptionToChroma,
    searchPosts
}


// UNLIKE THE FACE_MATCH FILE THE CHROME CLIENT IS INITIALIZED HERE
// AND 