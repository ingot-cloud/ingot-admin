FROM nginx
VOLUME /tmp
ENV LANG en_US.UTF-8
ADD ./dist/ /usr/share/nginx/html/
COPY ./proxy.conf /etc/nginx/conf.d/
EXPOSE 3000
EXPOSE 443