const lodash = require('lodash');
const logger = require('winston');

class State {
    constructor(status) {
        this.size = { w:8, h:4 };
        this.status = {};
        if (lodash.isObject(status)) {
            this.status = lodash.cloneDeep(status);
        }
        this.leaderboard = [];
        for (let i=0; i<(this.size.w * this.size.h); i++) {
            this.leaderboard[i] = {};
        }
    }

    update(data) {
        if (!data.repository) {
            throw new Error('no repository');
        }

        let repo = data.repository.name;
        if (!this.status.hasOwnProperty(repo)) {
            this.status[repo] = {};
        }

        let branch = data.branch;
        if (!this.status[repo].hasOwnProperty(branch)) {
            this.status[repo][branch] = {};
        }

        if (!this.status[repo][branch].build || data.number > this.status[repo][branch].build) {
            this.status[repo][branch].build = data.number;
        }
        if (data.number < this.status[repo][branch].build) {
            throw new Error('build is old');
        }
        this.status[repo][branch].status = data.status_message;

        this._updateLeaderboard();
    }

    _updateLeaderboard() {
        let kernelRepoName = 'main-repository';
        if (!this.status.hasOwnProperty(kernelRepoName)) {
            throw new Error('no ' + kernelRepoName);
        }

        let kernelRepo = this.status[kernelRepoName];
        Object.keys(kernelRepo).forEach((branchName) => {
            let branch = this.status[kernelRepoName][branchName];
            if (!branch.index) {
                branch.index = this._getLeaderboardPosition(branch.build);
            }
            if (branch.index == -1) {
                console.log('deleting ' + branchName);
                delete this.status[kernelRepoName][branchName];
            }
            else {
                this.leaderboard[branch.index].value = branch.status;
                this.leaderboard[branch.index].score = branch.build;
            }
        });
    }

    _getLeaderboardPosition(score) {
        if (!score) {
            score = 0;
        }

        let lowest = { score: Number.MAX_SAFE_INTEGER, index: -1 };
        for (let index in this.leaderboard) {
            let position = this.leaderboard[index];
            if (!position.value) {
                return index;
            }
            if (position.score < lowest.score) {
                lowest.score = position.score;
                lowest.index = index;
            }
        }

        if (score >= lowest.score) {
            return lowest.index;
        }
        return -1;
    }

    dump() {
        return lodash.cloneDeep(this.status);
    }

    _statusColor(status) {
        if (!status) {
            return { r:0, g:0, b:0 };
        }

        if (status == 'passed' || status == 'fixed') {
            return { r:0, g:255, b:0 };
        }
        if (status == 'pending') {
            return { r:255, g:255, b:0 };
        }
        if (status == 'failed' || status == 'still failing' || status == 'broken') {
            return { r:255, g:0, b:0 };
        }

        return { r:0, g:0, b:255 };
    }

    buildMap() {
        let map = [];
        
        for (let y=0; y<this.size.h; y++) {
            for (let x=0; x<this.size.w; x++) {
                map.push({ x:x, y:y });
            }
        }

        for (let index in this.leaderboard) {
            let state = this.leaderboard[index].value;
            if (state) {
                map[index].color = this._statusColor(state.toLowerCase());
            }
        }

        return map;
    }
}

module.exports = { 'State': State };