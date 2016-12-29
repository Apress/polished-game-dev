<?php
include("php-closure.php");

//
// Usage : build [plaform] [sku] [environment]
// Requires PHP 5.3+
//
date_default_timezone_set('GMT');

$platform = isset($argv[1]) ? $argv[1] : "online";
$sku = isset($argv[2]) ? $argv[2] : "global";
$environment = isset($argv[3]) ? $argv[3] : "release";

$config = new GameConfig();

$builder = new GameDeploy($platform, $sku, $environment);
$builder->build();

function logOutput($msg) {
	file_put_contents("logs/output.txt", $msg . PHP_EOL, FILE_APPEND);
}

class GameConfig {
	public function __construct() {
		$this->externals = array();
		
		// Parse in the data. One line per external JS file.
		$cfg = @file("config/externals.conf");
		if ($cfg) {
			foreach($cfg as $line) {
				$this->externals[] = trim($line);
			}
		}
	}
}

class GameDeploy {
	public function __construct($platform, $sku, $environment) {
		$this->platform = $platform;
		$this->sku = $sku;
		$this->environment = $environment;
		$this->app = "app";
		
		$this->sourceDir = getcwd();
		$this->targetDir = "target/$this->platform/$this->sku/$this->environment";
	}

	public function build() {
		$this->createTemporaryDiretories();
		$this->prepareTarget();

		$this->copyTree("copy", $this->targetDir);

		$output = "var gTarget = { 'platform':'$this->platform', 'sku':'$this->sku', 'environment':'$this->environment'};";
		file_put_contents($this->targetDir . '/target.js', $output);
		
		$this->processCSS();
		
		$this->copyDir("lang");
		$this->copyDir("thirdparty");
		$this->processRoot();
		$this->processSource();
		$this->processResources();

		//$this->cleanTemporaryDiretories();
	}

	private function createTemporaryDiretories() {
		$this->tempDir = $this->sourceDir . "/temp/";
		@mkdir($this->tempDir, 0777, true);
	}
	
	private function cleanTemporaryDiretories() {
		$this->removeTree($this->tempDir);
	}

	private function prepareTarget() {
		$this->removeTree($this->targetDir);
		@mkdir($this->targetDir, 0777, true);
	}
	
	private function copyDir($dir) {
		$this->copyTree($this->app . "/$dir", $this->targetDir . "/$dir");
	}
	
	private function processSource() {
		// TODO
		$srcDir = $this->app;
		$cmd = "svn export " . $this->sourceDir . "/app " . $this->tempDir;
		//system($cmd);
		
		switch($this->environment) {
			case "dev":
				$this->copyTree($this->app, $this->targetDir);
				break;
			case "debug":
			case "release":
				
				// Combine all JS files into one
				$onefile = $this->tempDir . 'source.js';
				file_put_contents($onefile, "// SOURCE" . PHP_EOL);
				$this->processTree($this->app . '/js', $this->tempDir, function($s, $d, $param) {
					$contents = file_get_contents($s);
					file_put_contents($param, "// FILE START : $s" . PHP_EOL, FILE_APPEND);
					file_put_contents($param, $contents, FILE_APPEND);
					file_put_contents($param, "// FILE END : $s" . PHP_EOL, FILE_APPEND);
				}, $onefile);
				//
				if ($this->environment == 'debug') {
					copy($onefile, $this->targetDir . "/source.js");
				} else {
					global $config;

					$c = new PhpClosure();
					foreach($config->externals as $e) {
						logOutput("Adding external source : $e");
						$c->add($e);
					}
					$c->add($onefile)
					->cacheDir($this->tempDir)
					->whitespaceOnly();		// also whitespaceOnly, simpleMode, & advancedMode

					ob_start();	// output buffer captures the echo instructions in the library
					$c->write();
					file_put_contents($this->targetDir . "/source.js", ob_get_contents());
					ob_end_clean();
				}
				break;
		}
	}

	private function processRoot() {
		$this->processFolder($this->app, $this->targetDir, function($s, $d, $builder) {
			$info = new SplFileInfo($s);
			$extension = $info->getExtension();

			if ($extension == 'html' || $extension == 'htm') {
				$builder->processHTML($s, $d);
			} else {
				copy($s, $d);
			}
			
		}, $this);
	}
	
	// TODO: This shouldn't be public, but we need it for the callback
	// TODO: Learn callback closures in PHP
	public function processHTML($indexFileSource, $indexFileDestination) {
		
		$contents = file($indexFileSource);
		$copyThis = true;
		$output = '';
		foreach($contents as $line) {
			$matches = array();

			if (preg_match('<!-- ADD:ENVIRONMENT:(.*?):(.*?) -->', $line, $matches)) {
				if ($matches[2] == $this->environment) {
					logOutput("Adding environment file " . $matches[1]);
					$line = file_get_contents($this->sourceDir . '/externals/' . $matches[2] . '/' . $matches[1] . '.inc');
				}
			}

			// TODO: Extend this to exclude code based on sku and platform
			if (preg_match('<!-- BUILD:ENVIRONMENT:START:(.*?) -->', $line, $matches)) {
				$copyThis = $matches[1] == $this->environment ? true : false;
			} else if (preg_match('<!-- BUILD:ENVIRONMENT:END:(.*?) -->', $line, $matches)) {
				$copyThis = true;
			} else if ($copyThis) {
				$output .= $line . PHP_EOL;
			}
		}
	 	
	 	file_put_contents($indexFileDestination, $output);
	}

	private function processCSS() {
		$this->processTree($this->app . '/css', $this->targetDir . '/css', function($s, $d, $param) {
			
			$info = new SplFileInfo($s);
			$extension = $info->getExtension();
			switch($extension) {
				case 'css':
					$cssText = file_get_contents($s);
					$cssText = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $cssText);
					$cssText = str_replace(': ', ':', $cssText);
					$cssText = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $cssText);
						
					file_put_contents($d, $cssText);

					logOutput("Minimize CSS file from $s to $d");
					break;
				default:
					copy($s, $d);
					logOutput("Copying CSS from $s to $d");
			}
		});		
	}

	private function processResources() {
		$this->processTree($this->app . '/resources', $this->targetDir . '/resources', function($s, $d, $param) {
			$info = new SplFileInfo($s);
			$extension = $info->getExtension();
			switch($extension) {
				case 'json':
					$jsonText = file_get_contents($s);
					$jd = json_decode($jsonText);
					file_put_contents($d, json_encode($jd));
if ($jd == null) {
print "ERROR in $s";
}

					logOutput("Minimize JSON file from $s to $d");
					break;
				case 'png':
					// Create a null JSON file, if none exists
					$jsonFile = substr($s, 0, -3) . 'json';
					if (!is_file($jsonFile)) {
						$jsonFile = substr($d, 0, -3) . 'json';
						file_put_contents($jsonFile, '');
						logOutput("Adding null JSON to $s as $jsonFile");
					}
					// fall through intentionally
				default:
					copy($s, $d);
					logOutput("Copying resource from $s to $d");
			}
		});
	}
	
	private function processTree($source, $destination, $callback, $param = NULL) {
		$dir = opendir($source);
		@mkdir($destination);
		while(false !== ( $file = readdir($dir)) ) {
			if (( $file[0] != '.' ) && ( $file != '..' )) {
				if ( is_dir($source . '/' . $file) ) {
					$this->processTree($source . '/' . $file,$destination . '/' . $file, $callback, $param);
				}
				else {
					$callback($source . '/' . $file,$destination . '/' . $file, $param);
				}
			}
		}
		closedir($dir);
	}

	private function processFolder($source, $destination, $callback, $param = NULL) {
		$dir = opendir($source);
		@mkdir($destination);
		while(false !== ( $file = readdir($dir)) ) {
			if (( $file[0] != '.' ) && ( $file != '..' )) {
				if (is_file($source . '/' . $file) ) {
					$callback($source . '/' . $file,$destination . '/' . $file, $param);
				}
			}
		}
		closedir($dir);
	}

	private function copyTree($source, $destination) {
		$this->processTree($source, $destination, function($s, $d) {
			logOutput("Copying from $s to $d");
			copy($s, $d);
		});
	}
	
	private function removeTree($destination) {
		// TODO: Prevent errors when no destination folder exists
		$files = @array_diff(@scandir($destination), array('.','..'));
		foreach ($files as $file) {
			(is_dir("$destination/$file")) ? $this->removeTree("$destination/$file") : @unlink("$destination/$file");
		}
		return @rmdir($destination);
	}	
}
