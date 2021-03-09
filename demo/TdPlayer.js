import flvPlay from 'flv.js';

class TdPlayer {
    constructor(isdn, compId) {
        this.tdPlayer = null;
        this.playerTimer = null;
        this.bPlaying = false;
        this.isdn = isdn;
        this.compId = compId;
        this.empytCount = 0;
    }

    play() {
        if (this.tdPlayer) {
            this.destroy();
        }
        if (flvPlay.isSupported()) {
            this.tdPlayer = flvPlay.createPlayer(
                {
                    type: "flv",
                    isLive: true,
                    hasAudio: false,
                    url: constant.MONITOR_PLAY_URL + this.isdn + "." + "flv"
                },
                {
                    enableStashBuffer: false,
                    stashInitialSize: 384,
                    autoCleanupSourceBuffer: true,
                    deferLoadAfterSourceOpen: false
                }
            );
            let vm = this;
            setTimeout(function () {
                vm.tdPlayer.attachMediaElement(document.getElementById(vm.compId));
                vm.tdPlayer.load();

                vm.tdPlayer.on(flvPlay.Events.LOADING_COMPLETE, () => {
                    console.log("[PLAYER]" + vm.isdn + " stream stopped, destroy player");
                    vm.destroy();
                });
                vm.tdPlayer.on(flvPlay.Events.ERROR, () => {
                    if (vm.bPlaying) {
                        console.log("[PLAYER]" + vm.isdn + " playing error, replay...");
                        vm.replay();
                    }
                });

                let video = document.getElementById(vm.compId);
                video.addEventListener("canplay", () => {
                    if (!vm.bPlaying) {
                        console.log("[PLAYER]" + vm.isdn + " event canplay, start play...");
                        vm.tdPlayer.play();
                    }
                });
                video.addEventListener("play", () => {
                    if (!vm.bPlaying) {
                        console.log("[PLAYER]" + vm.isdn + " playing");
                        vm.bPlaying = true;
                    }
                });
                video.addEventListener("abort", () => {
                    if (vm.bPlaying) {
                        console.log("[PLAYER]" + vm.isdn + " abort");
                        vm.bPlaying = false;
                    }
                });
                video.addEventListener("pause", () => {
                    if (vm.bPlaying) {
                        console.log("[PLAYER]" + vm.isdn + " pause");
                        vm.bPlaying = false;
                    }
                });
                video.onerror = function() {
                    console.log("[PLAYER]" + vm.isdn + " video error " + video.error.code + ", details: " + video.error.message);
                    if (video.error.code === 3 && vm.bPlaying) {
                        vm.replay();
                    }
                };

                vm.playerTimer = setInterval(() => {
                    if (!vm.bPlaying || !video) {
                        return;
                    }
                    if (video.pipelineStatus === 0) {
                        console.log("[PLAYER]" + vm.isdn + " pipeline stopped, replay...");
                        vm.replay();
                    } else if (video.pipelineStatus === 7) {
                        console.log("[PLAYER]" + vm.isdn + " pipeline suspended, replay...");
                        vm.replay();
                    } else {
                        if (video.buffered.length > 0) {
                            let end = video.buffered.end(0);
                            if (end - video.currentTime > 0.5) {
                                video.currentTime = end;
                            }
                            vm.empytCount = 0;
                        } else if (++vm.empytCount >= 3){
                            console.log("[PLAYER]" + vm.isdn + " video buffered empty, replay...");
                            vm.replay();
                            vm.empytCount = 0;
                        }
                    }
                }, 1000);
            }, 2000);
        }
    }

    destroy() {
        if (this.playerTimer) {
            clearInterval(this.playerTimer);
            this.playerTimer = null;
        }
        if (this.tdPlayer) {
            if (this.bPlaying) {
                this.tdPlayer.pause();
            }
            this.bPlaying = false;
            this.tdPlayer.unload();
            this.tdPlayer.detachMediaElement();
            this.tdPlayer.destroy();
            this.tdPlayer = null;
        }
    }

    replay() {
        if (this.tdPlayer && this.bPlaying) {
            this.tdPlayer.pause();
            this.bPlaying = false;
            this.tdPlayer.unload();
            this.tdPlayer.detachMediaElement();
            setTimeout(() => {
                this.tdPlayer.attachMediaElement(document.getElementById(this.compId));
                this.tdPlayer.load();
            }, 200);
        }
    }
}

export default TdPlayer;
