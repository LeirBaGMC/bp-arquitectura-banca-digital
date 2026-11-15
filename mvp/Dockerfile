FROM node:22-alpine AS frontend-build
WORKDIR /src/web
ARG VITE_COGNITO_AUTHORITY=""
ARG VITE_COGNITO_DOMAIN=""
ARG VITE_COGNITO_CLIENT_ID=""
ARG VITE_COGNITO_REDIRECT_URI=""
ARG VITE_COGNITO_SCOPE="bp/banking-api"
ARG VITE_LOCAL_AUTH="false"
ENV VITE_COGNITO_AUTHORITY=$VITE_COGNITO_AUTHORITY \
    VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN \
    VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID \
    VITE_COGNITO_REDIRECT_URI=$VITE_COGNITO_REDIRECT_URI \
    VITE_COGNITO_SCOPE=$VITE_COGNITO_SCOPE \
    VITE_LOCAL_AUTH=$VITE_LOCAL_AUTH
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY api/api.csproj api/
RUN dotnet restore api/api.csproj
COPY api/ api/
COPY --from=frontend-build /src/api/wwwroot/ api/wwwroot/
RUN dotnet publish api/api.csproj --configuration Release --output /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080 \
    Banking__DatabasePath=/data/bp-demo.db
RUN mkdir -p /data && chown "$APP_UID:$APP_UID" /data && chmod 700 /data
COPY --from=api-build --chown=$APP_UID:$APP_UID /out/ ./
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "api.dll"]
