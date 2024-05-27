import React, { useState } from 'react';
import axios from 'axios';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface Actor {
    primaryName: string;
}

interface Match {
    content_url: string;
    actor_name: Actor[];
    nconst: Number;
}

export default function FindMatches({
    image,
    selectedActor,
    setSelectedActor
} 
: {
    image: File | null,
    selectedActor: string | null,
    setSelectedActor: (actorName: string) => void
}) {
    const [faceMatches, setFaceMatches] = useState<Match[]>([]);
    //const [selectedActor, setSelectedActor] = useState<string | null>('');

    async function getFaceMatches() {
        if(!image) {
            console.log("No image provided.");
            return;
        }

        const formData = new FormData();
        formData.append('image', image);
        console.log(formData.get('image'));

        try {
            const response = await axios.post('http://localhost:8080/faceMatches', formData);
            console.log(response.data.results[0]);
            console.log("asdfasdf");
            console.log(response.data.rawData[0]);
            setFaceMatches(response.data.results);
        } catch (error) {
            console.log(error);
        }
    }

    function callAPI() {
        getFaceMatches();
    }

    function MatchDisplay() {
        return (
            <div className="flex flex-row max-w-[500px] bg-slate-200 rounded-lg mt-2">
                {faceMatches.map((match : Match, index) => {
                    const matchInfo = match.actor_name;
                    console.log(matchInfo);
                    const actorName = matchInfo[0].primaryName;
                    return (
                        <div key={index} className="my-2">
                            <div className="p-2">
                                <button type="button" onClick={() => {setSelectedActor(actorName)}}>
                                    <img src={match.content_url} className="w-[200px] hover:opacity-75 rounded-lg duration-150"></img>
                                </button>
                                <br/>
                                <span className="text-sm italic">{match.actor_name[0].primaryName}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div>
            <Button
                variant="outlined"
                color="primary"
                onClick={callAPI}
                sx={{mb: 1, mt: 1}}
            >
                Find matches!
            </Button>
            {/*<button type="button" onClick={callAPI} className="bg-blue-400 p-2 rounded-lg text-white">Find matches!</button>*/}
            <Typography >
                Selected match: {selectedActor}
            </Typography>
            {faceMatches !== null && <MatchDisplay/>}
        </div>
    )
}