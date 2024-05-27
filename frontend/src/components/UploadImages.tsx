import React, { useState, useEffect } from 'react';

export default function UploadImages(
{ 
    setImportedImage 
} 
: 
{ 
    setImportedImage: (value: React.SetStateAction<File | null>) => void
}) {
    const [images, setImages] = useState<File[]>([]);
    const [imagesURL, setImagesURL] = useState<string[]>([]);

    useEffect(() => {
        if (images.length < 1)  return;
        const urls: string[] = [];
        images.forEach(image => urls.push(URL.createObjectURL(image)));
        setImagesURL(urls);
    }, [images])

    function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        setImages([...e.target.files!]);
        setImportedImage(e.target.files![0]);
    }

    return (
        <div className="items-center py-2 flex h-[48px]">
            <input type="file" onChange={onImageChange} className="text-sm w-[200px] p-1 bg-gray-200 rounded-lg font-medium mr-2"/>
            { imagesURL.map((url, index) => (
                <img key={index} src={url} alt="uploaded" className="h-[48px] w-[48px] object-cover rounded-full ring-2 ring-white"/>
            ))}
        </div>
    )
}