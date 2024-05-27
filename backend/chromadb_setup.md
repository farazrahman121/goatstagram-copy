# How to use ChromaDB for easy setup
Hey guys, I don't entirely know how I did this for ChromaDB, but these are the basics to get it work...

### Connecting to ChromaDB
--------------------------
Here are some basic instructions to launch ChromaDB:
1. You need to first cd into the backend: 
    * `cd backend`


2. Then, in the backend, you run this command:
    * `chroma run --host 0.0.0.0 --port 8000`

By this point you should be good enough

### Running everything else
--------------------------
If you've connected ChromaDB successfully, then all you need to do now is run the frontend and the backend on separate terminals.

If you go to http://localhost:4567/user1/home, for instance, you should be able to see a "choose fie + find matches" button. If your backend is running on port 8080, you can upload a profile picture, and after find matches, you can see five matches in return!

### Bugs I haven't figured out yet
--------------------------
For some reason, the matching function just doesn't work for certain images that, I guess, I don't have a face? So I guess that'll be fixed later.