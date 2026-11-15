# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/api.csproj ./
RUN dotnet restore ./api.csproj

COPY backend/ ./
RUN dotnet publish ./api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
ARG APP_UID=1654
WORKDIR /app

COPY --from=build --chown=${APP_UID}:${APP_UID} /app/publish/ ./
RUN mkdir -p /var/lib/bp-banking \
    && chown ${APP_UID}:${APP_UID} /var/lib/bp-banking

ENV ASPNETCORE_HTTP_PORTS=5080 \
    DOTNET_EnableDiagnostics=0

USER ${APP_UID}
EXPOSE 5080
ENTRYPOINT ["dotnet", "api.dll"]
