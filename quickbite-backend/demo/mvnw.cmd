@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------

@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"

if not "%MAVEN_PROJECTBASEDIR%" == "" (
  set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
)

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

if not exist "%WRAPPER_JAR%" (
  echo Error: Maven Wrapper JAR not found:
  echo %WRAPPER_JAR%
  exit /b 1
)

set "MAVEN_CMD_LINE_ARGS=%*"

"%JAVA_HOME%\bin\java.exe" ^
  -classpath "%WRAPPER_JAR%" ^
  org.apache.maven.wrapper.MavenWrapperMain %MAVEN_CMD_LINE_ARGS%

if ERRORLEVEL 1 (
  exit /b %ERRORLEVEL%
)

endlocal