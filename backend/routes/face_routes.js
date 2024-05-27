const { findTopKMatches, initializeFaceModels } = require('../models/chroma_face_match.js');
const { getTempS3URL } = require('../utils/s3.js');
const { ChromaClient } = require("chromadb");
const dbsingleton = require('../models/db_access.js');

// console.log("WARNING: THIS FILE IS DEACTIVATED AND WILL NOT WORK");
const client = new ChromaClient();
const db = dbsingleton;

var postFaceMatches = async function(req, res) {
    if (!req.file) {
        return res.status(400).json( {error: 'No image provided'} );
    }

    const image = req.file.path;
    console.log(image);

    try {
        console.log("Initializing face models");

        initializeFaceModels().then(async () => {
            console.log("Initialized face models");
            console.log("Connecting to ChromaDB...");

            const collection = await client.getCollection({
                name: "face-api",
            });

            console.log("grabbed the collection");

            const results = await findTopKMatches(collection, image, 5);
            console.log(results);
            const documents = results[0].documents;
            console.log(documents);

            if (documents.length == 0) {
                return res.status(200).json({results: []});
            }

            const documentList = documents[0];
            const urlResults = [];

            for (const document of documentList) {
                // All of the movie actors are of .jpg, so I hopefully don't have to worry about this
                // Also they don't have any hyphens. I do not think this is good practice
                const nconst = document.split('.')[0];
                var query = `SELECT primaryName FROM actors WHERE nconst = '${nconst}'`;

                const content_url = await getTempS3URL(document);
                const queryResponse = await db.send_sql(query);
                
                if( queryResponse.length != 0 ) {
                    urlResults.push(
                        {
                            content_url: content_url,
                            actor_name: queryResponse,
                            nconst: nconst
                        }
                    );
                } else {
                    urlResults.push(
                        {
                            content_url: content_url,
                            actor_name: [{primaryName: "Name Not Found"}],
                            nconst: nconst
                        }
                    );
                }

                
            }

            res.status(200).json(
                {   
                    results: urlResults,
                    rawData: results
                }
            );
        })
    } catch (error) {
        res.status(500).json( {error: error} );
    }
}

var putMatchUserActor = async function(req, res) {
    const { user_id, actor_name } = req.body;

    if(!user_id || !actor_name) {
        return res.status(400).json( {error: 'User ID and actor name are required'} );
    }

    try {
        var query = `DELETE FROM face_match WHERE user_id = ${user_id}`;
        await db.send_sql(query);

        var query = `INSERT INTO face_match (user_id, actor_name) VALUES (${user_id}, '${actor_name}')`;
        await db.send_sql(query);
    
        res.status(200).json( {message: 'Successfully added face match'} );
    } catch (error) {
        res.status(500).json( {error: error} );
    }
}

var getActor = async function(req, res) {
    const { user_id, username } = req.query;

    if (!user_id && !username)  {
        return res.status(400).json( {error: 'User ID or username are required'} );
    }

    try {
        let id = user_id;

        if (!user_id) {
            var query = `SELECT user_id FROM users WHERE username = '${username}'`;
            const response = await db.send_sql(query);
            id = response[0].user_id;
        }

        console.log(`will check ${id} for any matches`);

        var query = `SELECT actor_name FROM face_match WHERE user_id = ${id}`;
        const response = await db.send_sql(query);

        res.status(200).json( {actor: response} );

    } catch (error) {
        res.status(500).json( {error: error} );
    }
}

var getActorPhoto = async function(req, res) {
    const { actor_name } = req.query;

    if (!actor_name) {
        return res.status(400).json( {error: 'Actor name is required'} );
    }

    try {
        var query = `SELECT nconst FROM actors WHERE primaryName = '${actor_name}'`;
        const response = await db.send_sql(query);

        const nconst = response[0].nconst;
        const content_url = await getTempS3URL(`${nconst}.jpg`);

        res.status(200).json( {content_url: content_url} );

    } catch (error) {
        res.status(500).json( {error: error} );
    }
}

var routes = { 
    post_face_matches: postFaceMatches,
    put_match_user_actor: putMatchUserActor,
    get_actor: getActor,
    get_actor_photo: getActorPhoto
}; 

module.exports = routes;