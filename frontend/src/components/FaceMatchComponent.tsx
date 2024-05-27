import React, { useState } from 'react';

import UploadImages from './UploadImages.tsx';
import FindMatches from './FindMatches.tsx';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function FaceMatch({
    selectedActor,
    setSelectedActor
}
:
{
    selectedActor: string | null,
    setSelectedActor: (actorName: string) => void
}) {
    const [importedImage, setImportedImage] = useState<File | null>(null);

    return(
        <Card>
            <CardContent>
                <UploadImages setImportedImage={setImportedImage}/>
                <FindMatches 
                    image={importedImage} 
                    selectedActor={selectedActor}
                    setSelectedActor={setSelectedActor}
                />
            </CardContent>
        </Card>
    )
}