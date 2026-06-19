app.get("/api/server-status", async (req, res) => {
try {
const response = await fetch("https://api.mcsrvstat.us/2/legacynw.craftmc.com.tr");
const data = await response.json();

    res.json({
        online: data.online,
        players: data.players?.online || 0,
        max: data.players?.max || 0,
        ping: data.debug?.ping || 0,
        ip: "legacynw.craftmc.com.tr"
    });

} catch (e) {
    res.json({ online:false });
}

});
