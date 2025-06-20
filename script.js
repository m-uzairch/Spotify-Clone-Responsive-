let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${currFolder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let songName = decodeURIComponent(element.href.split("/").pop()); // ✅ Fixed by Chaty
            songs.push(songName);
        }
    }

    // Play the first song

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    if (!songUL) return;
    songUL.innerHTML = ""; // ✅ Clear existing list first

    for (const song of songs) {
        let displayName = song.replaceAll("%20", " ").replace(".mp3", ""); // ✅ Clean display
        songUL.innerHTML += `
        <li data-filename="${song}">
            <img class="invert" src="img/music.svg" alt="">  
            <div class="info">
                <div>${displayName}</div>
                <div>Uzair C.</div>
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Play song on click
    Array.from(document.querySelectorAll(".songList li")).forEach(e => {
        e.addEventListener("click", () => {
            const filename = e.getAttribute("data-filename"); // ✅ Always play by filename
            playMusic(filename);
        });
    });
    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    const cleanedTrackName = track.replace(".mp3", ""); // ✅ Clean display
    document.querySelector(".songInfo").innerHTML = cleanedTrackName;
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
};

async function displayAlbum() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let folders = [];

    for (let index = 0; index < anchors.length; index++) {
        const element = anchors[index];
        const href = element.href;

        if (href.includes("/songs/") && !href.endsWith(".mp3") && !href.includes(".htaccess")) {
            let folder = href.split("/").filter(Boolean).pop();

            try {
                // ✅ Await JSON fetch
                let metadataResponse = await fetch(`/songs/${folder}/info.json`);
                let metadata = await metadataResponse.json();

                // ✅ Add to DOM
                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpeg" alt="">
                    <h2>${metadata.title || "Untitled"}</h2>
                    <p>${metadata.description || "No description."}</p>
                </div>`;
            } catch (err) {
                console.warn(`Could not load metadata for folder: ${folder}`, err);
            }
        }
    }

    // ✅ Add click listeners after DOM update
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (e) => {
            let folderName = e.currentTarget.getAttribute("data-folder");
            songs = await getSongs(`songs/${folderName}`);
            playMusic(songs[0]);
        });
    });
}


async function main() {
    let fetchedSongs = await getSongs("songs/Liked Songs");
    songs = fetchedSongs;

    playMusic(songs[0], true);

    // Display all the albums on the page
    displayAlbum()

    const play = document.getElementById("play");
    if (play) {
        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause(); // ✅ Pause music
                play.src = "img/play.svg";
            }
        });
    }

    currentSong.addEventListener("timeupdate", () => {
        if (isNaN(currentSong.duration)) return;
        document.querySelector(".songTime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekBar").addEventListener("click", e => {
        const seekBar = e.target.getBoundingClientRect();
        let percent = (e.offsetX / seekBar.width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    // ✅ Fixed: Previous/Next based on correct filename comparison
    previous.addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentFile);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentFile);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // ✅ Fixed volume logic (was setting to 0)
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    });

    // Add event listener to mute the app
    document.querySelector(".volume>img").addEventListener("click", e=>{
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = 0.1; 
            document.querySelector(".range").getElementsByTagName("input")[0].value = 100;
        }
    })
   

}

main();
