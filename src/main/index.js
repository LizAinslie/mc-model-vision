const package = require('../../package.json');

// Standard library
const path = require('path');

// Electron imports
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const { is } = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');

// Setup
unhandled();
debug();
contextMenu();
app.setAppUserModelId(package.build.appId);

/**
 * The app
 * @author RailRunner16
 */
class MCModelVisionApp {
	constructor() {
		/**
		 * The application's main window
		 * @type {Electron.BrowserWindow}
		 */
		this.win = null;
	}

	async createWindow() {
		this.win = new BrowserWindow({
			title: app.name,
			width: 600,
			height: 400,
			frame: false,
			webPreferences: {
				nodeIntegration: true,
			},
		});

		this.win.on('closed', () => {
			this.win = null;
		});

		await this.win.loadFile(path.resolve(__dirname, '..', 'renderer', 'index.html'));
	}

	async initAutoUpdater() {
		if (!is.development) {
			const FOUR_HOURS = 1000 * 60 * 60 * 4;
			setInterval(() => autoUpdater.checkForUpdates(), FOUR_HOURS);
			await autoUpdater.checkForUpdates();
		}
	}

	preventMultipleWindows() {
		if (!app.requestSingleInstanceLock()) app.quit();

		app.on('second-instance', () => {
			if (this.win) {
				if (this.win.isMinimized()) this.win.restore();
				this.win.show();
			}
		});
	}

	initMainAppEvents() {
		app.on('activate', async () => {
			if (this.win === null) await this.createWindow();
		});

		app.on('window-all-closed', () => {
			if (!is.macos) app.quit();
		});
	}

	setupIPC() {
		ipcMain.handle('open_file', async (event, ...args) => {
			const fileNames = dialog.showOpenDialogSync({
				filters: {
					extensions: ['json'],
				},
			});

			if (fileNames === undefined) return null;

			return fileNames[0];
		});

		ipcMain.handle('close_app', async (event, ...args) => {
			app.quit();
		});
	}
}

const modelVisionApp = new MCModelVisionApp();
modelVisionApp.initAutoUpdater();
modelVisionApp.preventMultipleWindows();
modelVisionApp.initMainAppEvents();

(async () => {
	await app.whenReady();
	modelVisionApp.createWindow();
	modelVisionApp.setupIPC();
})();
