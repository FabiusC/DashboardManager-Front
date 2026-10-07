FROM node:18-alpine
RUN mkdir -p /app
RUN chmod 777 -R /app
RUN ls -la
WORKDIR /app
COPY . /app
RUN ls -la
RUN chmod 777 -R startServices.sh
RUN ls -la
CMD ["/app/startServices.sh"]